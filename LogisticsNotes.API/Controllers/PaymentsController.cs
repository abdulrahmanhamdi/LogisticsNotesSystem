using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LogisticsNotes.API.Models;

namespace LogisticsNotes.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly LogisticsDbContext _context;

        public PaymentsController(LogisticsDbContext context)
        {
            _context = context;
        }

        [HttpGet("Methods")]
        public async Task<ActionResult<IEnumerable<PaymentMethod>>> GetPaymentMethods()
        {
            return await _context.PaymentMethods.ToListAsync();
        }

        [HttpGet("ByShipment/{shipmentId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetPaymentsByShipment(int shipmentId)
        {
            var payments = await _context.Payments
                .Where(p => p.ShipmentId == shipmentId)
                .Include(p => p.Method)
                .Select(p => new
                {
                    p.PaymentId,
                    p.Amount,
                    p.PaymentDate,
                    MethodName = p.Method.MethodName
                })
                .ToListAsync();

            return payments;
        }

        [HttpPost]
        public async Task<ActionResult<Payment>> PostPayment(Payment payment)
        {
            payment.PaymentDate = DateTime.Now; 
            payment.IsSuccessful = true;

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetPaymentsByShipment", new { shipmentId = payment.ShipmentId }, payment);
        }
    }
}